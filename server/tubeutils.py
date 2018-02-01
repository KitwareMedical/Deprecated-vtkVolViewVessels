import sys
if sys.version_info >= (3, 0):
  from io import StringIO
else:
  from StringIO import StringIO

import itk

def Enum(*names):
    enums = dict(zip(names, range(len(names))))
    return type('Enum', (object,), enums)

def DowncastToVesselTubeSOPoint(soPoint):
    '''Hacky way to downcast SpatialObjectPoint.'''
    buf = StringIO()
    #print >> buf, soPoint
    print( soPoint, file=buf )
    buf.seek(0)
    props = buf.read().split("\n")

    dim = len(soPoint.GetPosition())
    vesselTubePoint = itk.VesselTubeSpatialObjectPoint[dim]()

    vesselTubePoint.SetID(soPoint.GetID())
    vesselTubePoint.SetPosition(*soPoint.GetPosition())
    vesselTubePoint.SetBlue(soPoint.GetBlue())
    vesselTubePoint.SetGreen(soPoint.GetGreen())
    vesselTubePoint.SetRed(soPoint.GetRed())
    vesselTubePoint.SetAlpha(soPoint.GetAlpha())

    radius = float(props[3].strip()[len("R: "):])
    vesselTubePoint.SetRadius(radius)

    tangent = list(map(float, props[5].strip()[len("T: ["):-1].split(",")))
    vesselTubePoint.SetTangent(*tangent)

    normal1 = list(map(float, props[6].strip()[len("Normal1: ["):-1].split(",")))
    normal2 = list(map(float, props[7].strip()[len("Normal2: ["):-1].split(",")))
    vesselTubePoint.SetNormal1(*normal1)
    vesselTubePoint.SetNormal2(*normal2)

    medialness = float(props[8].strip()[len("Medialness: "):])
    vesselTubePoint.SetMedialness(medialness)

    ridgeness = float(props[9].strip()[len("Ridgeness: "):])
    vesselTubePoint.SetRidgeness(ridgeness)

    alpha1 = float(props[10].strip()[len("Alpha1: "):])
    alpha2 = float(props[11].strip()[len("Alpha2: "):])
    alpha3 = float(props[12].strip()[len("Alpha3: "):])
    vesselTubePoint.SetAlpha1(alpha1)
    vesselTubePoint.SetAlpha2(alpha2)
    vesselTubePoint.SetAlpha3(alpha3)

    mark = float(props[13].strip()[len("Mark: "):])
    vesselTubePoint.SetMark(bool(mark))

    return vesselTubePoint

def GetTubePoints(tube):
    '''Gets the points and radii associated with the tube.'''
    points = list()
    for j in range(tube.GetNumberOfPoints()):
        point = tube.GetPoint(j)
        point = DowncastToVesselTubeSOPoint(point)

        radius = point.GetRadius()
        pos = point.GetPosition()

        # I think I need to extract the values otherwise corruption occurs
        # on the itkPointD3 objects.
        points.append(((pos[0], pos[1], pos[2]), radius))
    return points
