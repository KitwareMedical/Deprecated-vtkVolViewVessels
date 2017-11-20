PENDING, SUCCESS, EXCEPTION = range(3)

class Deferred(object):
    '''Represents a deferred result.'''

    def __init__(self):
        self.success_cbs = list()
        self.exception_cbs = list()
        self.state = PENDING
        self.cbargs = ((), {})

    def on_success(self, func):
        self._add_cb(func, self.success_cbs, SUCCESS)

    def on_exception(self, func):
        self._add_cb(func, self.exception_cbs, EXCEPTION)

    def resolve(self, *args, **kwargs):
        self.state = SUCCESS
        self._invoke(self.success_cbs, *args, **kwargs)

    def reject(self, *args, **kwargs):
        self.state = EXCEPTION
        self._invoke(self.exception_cbs, *args, **kwargs)

    def _add_cb(self, func, cbs, target_state):
        args, kwargs = self.cbargs
        if self.state is target_state:
            func(*args, **kwargs)
        else:
            cbs.append(func)

    def _invoke(self, cbs, *args, **kwargs):
        self.cbargs = (args, kwargs)
        for cb in cbs:
            cb(*args, **kwargs)
