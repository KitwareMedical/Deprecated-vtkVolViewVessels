class Deferred(object):
    '''Represents a deferred result.'''

    def __init__(self):
        self.success_cbs = list()
        self.exception_cbs = list()

    def resolve(self, *args, **kwargs):
        self._invoke(self.success_cbs, *args, **kwargs)

    def reject(self, *args, **kwargs):
        self._invoke(self.exception_cbs, *args, **kwargs)

    def _invoke(self, cbs, *args, **kwargs):
        for cb in cbs:
            cb(*args, **kwargs)
