import sys
import numpy as np

# import itk modules.
import itk
from itkTypes import itkCType
import ctypes

# import client methods
from server import register, Protocol

# import tube utils
from tubeutils import GetTubePoints

# map from itkCType to ctype
itkCTypeToCtype = {
        itk.B: ctypes.c_bool,
        itk.D: ctypes.c_double,
        itk.F: ctypes.c_float,
        itk.LD: ctypes.c_longdouble,
        itk.SC: ctypes.c_char,
        itk.SI: ctypes.c_int,
        itk.SL: ctypes.c_long,
        itk.SLL: ctypes.c_longlong,
        itk.SS: ctypes.c_short,
        itk.UC: ctypes.c_ubyte,
        itk.UI: ctypes.c_uint,
        itk.UL: ctypes.c_ulong,
        itk.ULL: ctypes.c_ulonglong,
        itk.US: ctypes.c_ushort
}

# map from itk ctype to js array type
itkCTypeToJsArray = {
        itk.B: 'UInt8Array',
        itk.D: 'Float64Array',
        itk.F: 'Float32Array',
        itk.LD: 'Float64Array',
        itk.SC: 'Int8Array',
        itk.SI: 'Int32Array',
        itk.SL: 'Int32Array',
        itk.SLL: 'Int32Array',
        itk.SS: 'Int16Array',
        itk.UC: 'UInt8Array',
        itk.UI: 'UInt32Array',
        itk.UL: 'UInt32Array',
        itk.ULL: 'UInt32Array',
        itk.US: 'UInt16Array',
}

# map from itk ctype to numpy dtype
itkCTypeToDType = {
        itk.B: 1,
        itk.D: 8,
        itk.F: 4,
        itk.LD: 8,
        itk.SC: 1,
        itk.SI: 4,
        itk.SL: 4,
        itk.SLL: 4,
        itk.SS: 2,
        itk.UC: 1,
        itk.UI: 4,
        itk.UL: 4,
        itk.ULL: 4,
        itk.US: 2,
}

class ITKTubeProtocol(Protocol):
    def __init__(self, *args, **kwargs):
        super(ITKTubeProtocol, self).__init__(*args, **kwargs)

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
        self.curTubeId = 0

        scaleVector = self.itkImage.GetSpacing()
        offsetVector = self.itkImage.GetOrigin()

        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetScale(scaleVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetOffset(offsetVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetMatrix(self.itkImage.GetDirection())
        self.segmentTubes.GetTubeGroup().ComputeObjectToWorldTransform()

    def loadItkImage(self, filename):
        base = itk.ImageIOFactory.CreateImageIO(filename, itk.ImageIOFactory.ReadMode)
        base.SetFileName(filename)
        base.ReadImageInformation()

        componentType = base.GetComponentType()
        itkctype = itkCType.GetCType(base.GetComponentTypeAsString(componentType))
        imageType = itk.Image[itkctype, base.GetNumberOfDimensions()]

        reader = itk.ImageFileReader[imageType].New()
        reader.SetFileName(filename)
        reader.Update()

        self.itkImage = reader.GetOutput()
        self.itkPixelType = itkctype
        self.dimensions = base.GetNumberOfDimensions()

    @register('itk.volume.open')
    def openVolume(self, filename):
        filename = str(filename)
        if not filename:
            raise Exception('No filename provided')

        try:
            self.loadDataFile(filename)
        except Exception as e:
            sys.stderr.write('%s\n' % str(e))
            raise Exception('Failed to load file.')

        # Get ITK image data
        pointer = long(self.itkImage.GetBufferPointer())
        imageBuffer = ctypes.cast(pointer, ctypes.POINTER(itkCTypeToCtype[self.itkPixelType]))
        size = self.itkImage.GetLargestPossibleRegion().GetSize()

        buf = imageBuffer[:size[0]*size[1]*size[2]]
        pixelSize = itkCTypeToDType[self.itkPixelType]
        itkBinaryImageContent = np.array(buf, dtype=np.dtype('<i' + str(pixelSize))).tobytes()

        resp = {
            "extent": (0, size[0]-1, 0, size[1]-1, 0, size[2]-1),
            "origin": list(self.itkImage.GetOrigin()),
            "spacing": list(self.itkImage.GetSpacing()),
            "typedArray": itkCTypeToJsArray[self.itkPixelType],
        }
        return self.makeResponse(resp, itkBinaryImageContent)
