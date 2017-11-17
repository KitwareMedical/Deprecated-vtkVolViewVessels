import flatbuffers

from Message import Message
from Message.Type import Type as MessageType

class MessageWrapper(MessageType):
    # message type is provided by MessageType

    def __init__(self, id, type, target=None, payload=None, binaryAttachment1=None):
        '''Creates a message.

        Args:
            id: An integral ID.
            type: Either Message.Response or Message.Request.
            target: A string denoting the endpoint for this message.
            payload: A string representing the payload.
            binaryAttachment1: A bytearray() or bytes() representing some
                               binary payload. This is the preferred approach
                               for attaching binary payloads, rather than
                               serializing and passing as a payload.
        '''
        self.id = id
        self.type = type
        self.target = target
        self.payload = payload
        self.binaryAttachment1 = binaryAttachment1

    def tobytes(self):

        # create flatbuffer builder
        # defaults to 512 bytes of buffer size
        length = 512
        builder = flatbuffers.Builder(length)

        # build small data first, since flatbuffers builds bottom-up
        attachment = None
        target = None
        payload = None
        if self.binaryAttachment1:
            attachment = builder.CreateByteVector(self.binaryAttachment1)
        if self.target:
            target = builder.CreateString(target)
        if self.payload:
            payload = builder.CreateString(self.payload)

        Message.MessageStart(builder)
        Message.MessageAddId(builder, self.id)
        Message.MessageAddType(builder, self.type)
        if target:
            Message.MessageAddTarget(builder, target)
        if payload:
            Message.MessageAddPayload(builder, payload)
        if attachment:
            Message.MessageAddBinaryAttachment1(builder, attachment)
        message = Message.MessageEnd(builder)

        builder.Finish(message)
        return builder.Output()
