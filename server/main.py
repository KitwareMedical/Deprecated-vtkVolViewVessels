import sys

from server import Server
from itk_tube import ITKTubeProtocol

if __name__ == '__main__':
    # localhost results in "zmq.error.ZMQError: No such device"
    Server().start('127.0.0.1', 4555, ITKTubeProtocol)
