# Layered sprite exporter
# Usage:
#  > [path-to-blender] -b --log-level 0 -P [path-to-script]/Bake26.py  -- -i [single-file-or-directory-of-blend-files] -o [output-directory] -l [path-to-library]/_library.blend -p
# Ex:
#  > ~/Desktop/apps/blender*/blender -b --log-level 0 -P ~/git/Bake26D/src/Bake26.py  -- -i ~/git/Bake26D/data/blend/ -o ~/git/Bake26D/b26out -l ~/git/Bake26D/data/blend/_library.blend -Gb -Gj -p

import sys
import os
import imp
import shutil
import argparse
import subprocess
import glob
import math
import datetime
import multiprocessing
import bpy
from mathutils import Vector, Matrix, Euler
from PIL import Image
import atexit
import time

def import_file(path, import_global=True):
  try:
    import os
    if not os.path.isabs(path):
      path = os.path.join(os.path.dirname(os.path.realpath(__file__)), os.path.normpath(path))
    module_dir, module_file = os.path.split(path)
    module_name, module_ext = os.path.splitext(module_file)
    save_cwd = os.getcwd()
    os.chdir(module_dir)
    if not module_dir in sys.path:
      sys.path.append(module_dir)
    module_obj = __import__(module_name)
    module_obj.__file__ = path
    if import_global:
      for key, val in vars(module_obj).items():
        if key.startswith('__') and key.endswith('__'):
          continue
        thismod = sys.modules[__name__]
        vars(thismod)[key] = val
    else:
      globals()[module_name] = module_obj
    os.chdir(save_cwd)
  except Exception as e:
    raise Exception(e)
  return module_obj

import_file('./BlenderTools.py')

dbg("cwd:"+os.getcwd())

class ExportFormat: pass  # nopep8
class ExportLayer: pass  # nopep8
class LayerOutput: pass  # nopep8
class MtRegion: pass  # nopep8
class MtNode: pass  # nopep8
class MtIsland: pass  # nopep8
class ImagePacker: pass  # nopep8
class RenderInfo: pass  # nopep8
class ObjectInfo: pass  # nopep8
class ActionInfo: pass  # nopep8
class ExportSettings: pass  # nopep8
class Bake26: pass  # nopep8

class ExportFormat:
  PNG = 'PNG'
  OPEN_EXR = 'EXR'
class ExportLayer:
  Color = 'Color'
  DepthNormal = 'DepthNormal'
  Position = 'Position'
class RenderEngine:
  Eevee = 'BLENDER_EEVEE'
  Cycles = 'CYCLES'

class LayerOutput:
  # def __init__(self, node, format, layer):
  def __init__(self, layer: ExportLayer, format: ExportFormat, bitdepth: int):
    self._layer: ExportLayer = layer
    self._format: ExportFormat = format
    self._bitdepth: int = bitdepth
    self._compression: int = 100  # 0-100
    self._mode: str = 'RGBA'  # RGB RGBA
  def file_ext(self):
    ext = '.'
    if self._format == ExportFormat.PNG:
      ext += 'png'
    elif self._format == ExportFormat.OPEN_EXR:
      ext += 'exr'
    else:
      throw()
    return ext
  def layer_ext(self):
    ext = '.' + str(self._layer) + self.file_ext()
    return ext
  def mtex_filename(self, index: int):
    s = Bake26.c_B2MT_prefix + '.' + str(int(index)).zfill(3) + self.layer_ext()
    return s
  @staticmethod
  def parse_extension(path):
    d = path.rfind('.')
    if d > 0:
      d = path[:d].rfind('.')
      if d > 0:
        return path[d:]
    return None

class MtRegion:
  def __init__(self):
    self._layers = []
    self._width = 0
    self._height = 0
    self._iid = -1
    self._node = None
    self._frame = None

class MtNode:
  def __init__(self):
    self._rect = Box2i()
    self._child = [None, None]
    self._texture = None

  def plop(self, tex):
    assert(tex != None)
    assert(tex._width > 0)
    assert(tex._height > 0)

    if self._child[0] != None and self._child[1] != None:
      # leaf
      ret = self._child[0].plop(tex)
      if ret != None:
        return ret

      return self._child[1].plop(tex)
    else:
      if self._texture != None:
        return None

      bw = self._rect.width()  # int!!
      bh = self._rect.height()

      if tex._height > bh:
        return None

      if tex._width > bw:
        return None

      if (tex._width == bw) and (tex._height == bh):
        # prefect fit
        self._texture = tex
        return self

      self._child[0] = MtNode()
      self._child[1] = MtNode()

      dw = int(bw - tex._width)
      dh = int(bh - tex._height)

      if dw > dh:
        self._child[0]._rect.construct(
          self._rect.left(),
          self._rect.top(),
          self._rect.left() + tex._width,
          self._rect.bottom())
        self._child[1]._rect.construct(
          self._rect.left() + tex._width,
          self._rect.top(),
          self._rect.right(),
          self._rect.bottom())
      else:
        self._child[0]._rect.construct(
          self._rect.left(),
          self._rect.top(),
          self._rect.right(),
          self._rect.top() + tex._height)
        self._child[1]._rect.construct(
          self._rect.left(),
          self._rect.top() + tex._height,
          self._rect.right(),
          self._rect.bottom())
      return self._child[0].plop(tex)

class MtIsland:
  # individual texture of a multiple image mega texure
  def __init__(self):
    self._iid = 0
    self._size = 0  # w and h
    self._regioncount = 0
    self._root: MtNode = None
    self._texnames = []

  def compose(self, outpath):
    assert(self._root)

    for li in range(0, len(Bake26.c_layers)):
      self.packLayer(outpath, Bake26.c_layers[li], li)

  def packLayer(self, outpath, layeroutput: LayerOutput, idx: int):
    fname = layeroutput.mtex_filename(self._iid)
    Bake26.dbg("Packing layer "+fname+" size="+str(self._size))

    cpink = (255, 0, 255, 255)
    cblack = (0, 0, 0, 0)
    # bpy.ops.image.new(name='Untitled', width=1024, height=1024, color=(0.0, 0.0, 0.0, 1.0), alpha=True, generated_type='BLANK', float=False, use_stereo_3d=False, tiled=False)
    # https://pillow.readthedocs.io/en/stable/handbook/concepts.html#concept-modes
    # PIL only supports 8 bit pixels.
    with Image.new(mode="RGBA", size=(self._size, self._size), color=cblack) as master_img:
      # master_img.convert("PA")
      # note imae ha 'I' and 'F' for 32 bits
      # master_img = Image.new(mode="RGBA", size= (self._size, self._size), color=(0,0,0,0))
      self.copyImages(self._root, master_img, idx)
      self._texnames.append(fname)
      path = os.path.join(outpath, fname)
      Bake26.dbg(logcol.greenb + "" + path + logcol.reset)
      master_img.save(path)

  def copyImages(self, node, master, layeridx: int):
    assert(node)

    # also create objs for metadata
    if node._texture != None:  # node._texture = MtRegion
      path = node._texture._layers[layeridx]
      if os.path.exists(path):
        with Image.open(path) as img:
          Image.Image.paste(master, img, (node._rect.left(), node._rect.top()))

    if node._child[0] != None:
      self.copyImages(node._child[0], master, layeridx)
    if node._child[1] != None:
      self.copyImages(node._child[1], master, layeridx)

  def serialize(self, bf: BinaryFile):
    bf.writeInt32(self._iid)
    bf.writeInt32(self._size)
    bf.writeInt32(self._size)
    bf.writeInt32(len(self._texnames))
    for tn in self._texnames:
      bf.writeString(tn)

class ImagePacker:
  def packImages(regions, startsize=256, growsize=256):
    mega_texs = []
    size = int(startsize)
    growsize = int(growsize)
    maxsize = int(Bake26.c_max_tex_size_px)
    regions_last = regions[:]

    # note you cant get gpu maxsize in headless blender.. we just need to pick a value
    Bake26.dbg("Packing " + str(len(regions)) + " texs. maxsize=" + str(maxsize))

    cur_island_id = 1
    while size <= maxsize:
      regions_cpy = regions_last[:]
      size = min(int(size), int(maxsize))

      pt = ImagePacker.packForSize(regions_cpy, size, int(size) == int(maxsize), cur_island_id)

      if pt != None:
        pt._id = cur_island_id
        cur_island_id += 1
        mega_texs.append(pt)
        regions_last = regions_cpy[:]

        if int(size) == int(maxsize) and Bake26.c_uniform_tex_size == True:
          size = maxsize
        else:
          size = startsize
      else:
        size = min(int(size + growsize), maxsize)

      if len(regions_last) == 0:
        break

    # make sure we pcked everything
    for region in regions:
      assert(region._node != None)

    return mega_texs

  def packForSize(regions, size, force, island_id):
    pt = MtIsland()
    pt._size = int(size)
    pt._iid = island_id
    pt._root = MtNode()
    pt._root._rect = Box2i()
    pt._root._rect._min = ivec2(0, 0)
    pt._root._rect._max = ivec2(size, size)

    for ri in range(len(regions)-1, -1, -1):
      region = regions[ri]
      region._node = None
      region._iid = -1
      found = pt._root.plop(region)
      if found != None:
        region._node = found
        region._iid = island_id
        del regions[ri]
        pt._regioncount += 1

        # set frame info
        fr = region._frame
        assert(region._frame != None)
        fr._iid = region._iid
        fr._x = region._node._rect.left()
        fr._y = region._node._rect.top()
        fr._w = region._node._rect.width()
        fr._h = region._node._rect.height()

      else:
        if force:
          return pt
        return None
    return pt

class b2_datafile:
  c_magic: int = 1216926865
  def __init__(self):
    self._major = -1
    self._minor = -1
    self._mtex_w = -1
    self._mtex_h = -1
    self._layers = []  # string
    self._texs = []
    self._objs = []

  def serialize(self, bf: BinaryFile):
    bf.writeByte(int(ord('B'.encode('utf-8'))))
    bf.writeByte(int(ord('2'.encode('utf-8'))))
    bf.writeByte(int(ord('M'.encode('utf-8'))))
    bf.writeByte(int(ord('D'.encode('utf-8'))))

    bf.writeInt32(self._major)
    bf.writeInt32(self._minor)
    bf.writeInt32(self._mtex_w)
    bf.writeInt32(self._mtex_h)

    bf.writeInt32(b2_datafile.c_magic)

    bf.writeInt32(len(self._layers))
    for la in self._layers:
      bf.writeString(la)

    bf.writeInt32(len(self._texs))
    for t in self._texs:
      t.serialize(bf)

    bf.writeInt32(len(self._objs))
    for b in self._objs:
      b.serialize(bf)

    bf.writeInt32(b2_datafile.c_magic)

  # def deserialize(self, bf: BinaryFile):
  #   self._major = bf.readInt32()
  #   self._minor = bf.readInt32()
  #   tlen = bf.readInt32()
  #   for i in range(0, tlen):
  #     t = b2_mtexdata()
  #     t.deserialize(bf)
  #   blen = bf.readInt32()
  #   for i in range(0, blen):
  #     b = b2_objdata()
  #     b.deserialize(bf)
class b2_mtexdata:
  _iid: int = -1  # island id
  _w: int = -1
  _h: int = -1
  _images = []
  def serialize(self, bf: BinaryFile):
    bf.writeInt32(b2_datafile.c_magic)
    bf.writeInt32(self._iid)
    bf.writeInt32(self._w)
    bf.writeInt32(self._h)
    bf.writeInt32(len(self._images))
    bf.writeInt32(b2_datafile.c_magic)
    for img in self._images:
      bf.writeString(img)
  def deserialize(self, bf: BinaryFile):
    assert(bf.readInt32() == b2_datafile.c_magic)
    self._iid = bf.readInt32()
    self._w = bf.readInt32()
    self._h = bf.readInt32()
    imlen = bf.readInt32()
    assert(bf.readInt32() == b2_datafile.c_magic)
    for i in range(0, imlen):
      self._images.append(bf.readString())
class b2_objdata:
  _ob_idgen = 1
  def __init__(self):
    self._id: int = -1
    self._name = ""
    self._fps: float = 0
    self._final: int = 0  # 1 = success, 0 = blender crash, script fail etc
    self._actions = []
  def serialize(self, bf: BinaryFile):
    bf.writeInt32(b2_datafile.c_magic)
    bf.writeInt32(self._id)
    bf.writeString(self._name)
    bf.writeFloat(self._fps)
    bf.writeInt32(self._final)
    bf.writeInt32(len(self._actions))
    bf.writeInt32(b2_datafile.c_magic)
    for i in range(0, len(self._actions)):
      self._actions[i].serialize(bf)
  def deserialize(self, bf: BinaryFile):
"hello world"
x = y, z
x = y
x = y, z + w
    

    











"



































































































































































































































































"












































































































d"















































































































































































































































