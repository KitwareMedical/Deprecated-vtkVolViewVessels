r"""
    This module is a ITK Web server application.
    The following command line illustrates how to use it::

        $ python .../server/itk-tube.py --data /.../path-to-your-data-file

        --data
             Path to file to load.

    Any WSLink executable script comes with a set of standard arguments that can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another
             server to deliver the static content and the current process only
             focuses on the WebSocket connectivity of clients.
"""

# import to process args
import os
import argparse

from json import JSONEncoder
import numpy as np

# import itk modules.
import itk
from itkTypes import itkCType
import ctypes

import sys
if sys.version_info > (3,0):
    long = int

# import Twisted reactor for later callback
from twisted.internet import reactor

# import Web connectivity
from wslink import register
from wslink import server
from wslink.websocket import LinkProtocol

# import tube utils
from tubeutils import GetTubePoints

# maps itk ctype to other types
itkCTypeToOthers = {
        itk.B: (ctypes.c_bool, 'UInt8Array', 1, 'i'),
        itk.D: (ctypes.c_double, 'Float64Array', 8, 'f'),
        itk.F: (ctypes.c_float, 'Float32Array', 4, 'f'),
        itk.LD: (ctypes.c_longdouble, 'Float64Array', 8, 'f'),
        itk.SC: (ctypes.c_char, 'Int8Array', 1, 'i'),
        itk.SI: (ctypes.c_int, 'Int32Array', 4, 'i'),
        itk.SL: (ctypes.c_long, 'Int32Array', 4, 'i'),
        itk.SLL: (ctypes.c_longlong, 'Int32Array', 4, 'i'),
        itk.SS: (ctypes.c_short, 'Int16Array', 2, 'i'),
        itk.UC: (ctypes.c_ubyte, 'UInt8Array', 1, 'i'),
        itk.UI: (ctypes.c_uint, 'UInt32Array', 4, 'i'),
        itk.UL: (ctypes.c_ulong, 'UInt32Array', 4, 'i'),
        itk.ULL: (ctypes.c_ulonglong, 'UInt32Array', 4, 'i'),
        itk.US: (ctypes.c_ushort, 'UInt16Array', 2, 'i'),
}

# preload itk modules here so we don't incur lazy load
# on user request.
itk.TranslationTransform
itk.CompositeTransform
itk.ScaleTransform
itk.SegmentTubes
itk.Image
itk.ImageFileReader
itk.ImageIOFactory
itk.SpatialObjectReader

__id = 0
def get_next_id():
    '''Simple ID generator.'''
    global __id
    __id += 1
    return __id

def reset_id_counter():
    global __id
    __id = 0

class Tube(JSONEncoder):
    def __init__(self, _id=-1, parent=-1, params=None, status='pending', color=None, **kwargs):
        super(Tube, self).__init__(**kwargs)
        self.id = _id
        self.parent = parent
        self.params = params or dict()
        self.status = status
        self.color = color or [1, 0, 0] # default to red
        self.tube = None
        self._mesh = None

    @property
    def mesh(self):
        if not self.tube:
            return None
        if self._mesh:
            return self._mesh

        # generate mesh
        points = GetTubePoints(self.tube)

        # transform tube points properly
        self.tube.ComputeObjectToWorldTransform()
        transform = self.tube.GetIndexToWorldTransform()
        scaling = [transform.GetMatrix()(i,i) for i in range(3)]
        scale = sum(scaling) / len(scaling)

        for i in range(len(points)):
            pt, radius = points[i]
            pt = list(transform.TransformPoint(pt))
            points[i] = (pt, radius*scale)

        self._mesh = points
        return self._mesh

    def copyfrom(self, obj):
        '''Copies certain properties from a given dictionary.'''
        if type(obj) is not dict:
            raise Exception('Given object is not a dict!')

        self.id = obj.get('id', self.id)
        self.parent = obj.get('parent', self.parent)
        self.params = obj.get('params', self.params)
        self.status = obj.get('status', self.status)
        self.color = obj.get('color', self.color)

    def serialize(self):
        return dict(
            id=self.id,
            parent=self.parent,
            params=self.params,
            status=self.status,
            color=self.color,
            mesh=self.mesh,
        )

# =============================================================================
# Create Web Server to handle requests
# =============================================================================

class ItkTubeProtocol(LinkProtocol):

    timelapse = 0.1 # Time in seconds

    def __init__(self):
        self.idToSpatialObject = dict()
        # NOTE maybe not the most memory-efficient cache since we store points
        # in array form here?
        self.tubeCache = {}
        self.pendingTubes = []

    def loadDataFile(self, filename):
        # Load file in ITK
        self.loadItkImage(filename)

        # setup image to world transform, since segmenttubes
        # will use the world coords.
        self.imageToWorldTransform = itk.CompositeTransform[itk.D, 3].New()
        translate = itk.TranslationTransform[itk.D, 3].New()
        translate.Translate(self.itkImage.GetOrigin())
        scale = itk.ScaleTransform[itk.D, 3].New()
        scale.Scale(self.itkImage.GetSpacing())
        self.imageToWorldTransform.AppendTransform(translate)
        self.imageToWorldTransform.AppendTransform(scale)

        # setup segmenter
        imgType = itk.Image[self.itkPixelType, self.dimensions]
        self.segmentTubes = itk.SegmentTubes[imgType].New()
        self.segmentTubes.SetInputImage(self.itkImage)
        self.segmentTubes.SetDebug(True)

        scaleVector = self.itkImage.GetSpacing()
        offsetVector = self.itkImage.GetOrigin()

        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetScale(scaleVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetOffset(offsetVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetMatrix(self.itkImage.GetDirection())
        self.segmentTubes.GetTubeGroup().ComputeObjectToWorldTransform()

        # reset id counter between segments
        reset_id_counter()

    def scheduleQueueProcessing(self):
        if len(self.pendingTubes) > 0:
            reactor.callLater(ItkTubeProtocol.timelapse, self.processQueue)

    def processQueue(self):
        if len(self.pendingTubes) == 0:
            return

        itemToProcess = self.pendingTubes.pop(0)

        # extract tube
        seed = itk.Point[itk.D, self.dimensions](itemToProcess['position'])
        index = self.itkImage.TransformPhysicalPointToContinuousIndex(seed)

        scaleNorm = self.itkImage.GetSpacing()[0]
        if itemToProcess['params']['scale']/scaleNorm < 0.3:
            raise Exception('scale/scaleNorm < 0.3')
        self.segmentTubes.SetRadius(itemToProcess['params']['scale']/scaleNorm)

        tubeObj = self.segmentTubes.ExtractTube(index, itemToProcess['id'], True)
        itemToProcess['status'] = 'done'

        tube = Tube()
        tube.copyfrom(itemToProcess)

        if tubeObj:
            self.segmentTubes.AddTube(tubeObj)
            tube.tube = tubeObj
            self.tubeCache[tube.id] = tube

        # Publish any update
        self.publish('itk.tube.mesh', tube.serialize())

        # Reschedule ourself
        self.scheduleQueueProcessing()

    def loadItkImage(self, filename):
        base = itk.ImageIOFactory.CreateImageIO(filename, itk.ImageIOFactory.ReadMode)
        base.SetFileName(filename)
        base.ReadImageInformation()

        componentType = base.GetComponentType()
        itkctype = itkCType.GetCType("float")
        imageType = itk.Image[itkctype, base.GetNumberOfDimensions()]

        reader = itk.ImageFileReader[imageType].New()
        reader.SetFileName(filename)
        reader.Update()

        self.itkImage = reader.GetOutput()
        self.itkPixelType = itkctype
        self.dimensions = base.GetNumberOfDimensions()

    @register('itk.volume.open')
    def openVolume(self, filename):
        self.loadDataFile(str(filename))

        # Get ITK image data
        imgCType, imgJsArrType, pixelSize, pixelDType = itkCTypeToOthers[self.itkPixelType]
        pointer = long(self.itkImage.GetBufferPointer())
        imageBuffer = ctypes.cast(pointer, ctypes.POINTER(imgCType))
        size = self.itkImage.GetLargestPossibleRegion().GetSize()
        length = size[0]*size[1]*size[2]

        imgArray = np.ctypeslib.as_array(
                (imgCType * length).from_address(ctypes.addressof(imageBuffer.contents)))

        # Send data to client
        return {
            "extent": (0, size[0]-1, 0, size[1]-1, 0, size[2]-1),
            "origin": list(self.itkImage.GetOrigin()),
            "spacing": list(self.itkImage.GetSpacing()),
            "typedArray": imgJsArrType,
            "scalars": self.addAttachment(imgArray.tobytes()),
        }

    @register('itk.tube.save')
    def saveTubes(self, filename):
        dim = 3
        tubeGroup = self.segmentTubes.GetTubeGroup()

        writer = itk.SpatialObjectWriter[dim].New()
        writer.SetFileName(str(filename))
        writer.SetInput(tubeGroup)
        writer.Update()

    @register('itk.tube.generate')
    def generateTube(self, coords, params):
        coords = list(self.imageToWorldTransform.TransformPoint(coords))
        itemToProcess = {
            'id': get_next_id(),
            'parent': -1, # denotes this tube's parent as not a tube
            'position': coords,
            'params': params,
            'status': 'pending',
            'color': [1, 0, 0], # default to red
        }
        self.pendingTubes.append(itemToProcess)
        self.scheduleQueueProcessing()
        return itemToProcess

    @register('itk.tube.delete')
    def deleteTube(self, tubeId):
        tube = self.tubeCache[tubeId]
        self.segmentTubes.DeleteTube(tube.tube)
        del self.tubeCache[tubeId]

    @register('itk.tube.setcolor')
    def setTubeColor(self, tubeId, color):
        self.tubeCache[tubeId].color = color

    @register('itk.tube.reparent')
    def reparentTubes(self, parent, children):
        if type(parent) is not int or type(children) is not list:
            raise Exception('Invalid arguments')

        if parent in children:
            raise Exception('Cannot have tube be parent of itself')

        parentTube = self.tubeCache[parent].tube
        for child in children:
            # reparents child tube to parent tube
            parentTube.AddSpatialObject(self.tubeCache[child].tube)
            self.tubeCache[child].parent = parent
