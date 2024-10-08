import {WidgetElement} from '.'

interface TestWidgetAttributes {
  testId: string
}

class TestWidget extends WidgetElement<TestWidgetAttributes> {
  root: ShadowRoot
  testId: string

  ready = false
  changed = false
  destroyed = false

  static get observedAttributes() {
    return ['test-id']
  }

  initialize(shadowRoot: ShadowRoot) {
    this.root = shadowRoot
    this.ready = true
  }

  attributeChanged() {
    this.changed = true
  }

  destroy() {
    this.destroyed = true
  }
}

class TestWidgetWithFallback extends TestWidget {
  get fallback() {
    return `<span>Loading...</span>`
  }
}

TestWidget.register('test-widget')
TestWidgetWithFallback.register('test-widget-fallback')

test('register custom element once', () => {
  expect(customElements.get('test-widget')).toBe(TestWidget)

  // NOTE: try register multiple times
  TestWidget.register('test-widget')

  expect(customElements.get('test-widget')).toBe(TestWidget)
})

test('use widget as element', () => {
  const widget = document.createElement('test-widget') as TestWidget

  widget.setAttribute('test-id', '123')

  document.body.append(widget)

  expect(document.querySelector('test-widget')).toStrictEqual(widget)
  expect(widget.testId).toBe('123')
  expect(widget.getAttribute('test-id')).toBe('123')
})

test('use widget as constructor', () => {
  const widget = new TestWidget()

  widget.testId = '123'

  document.body.append(widget)

  expect(document.querySelector('test-widget')).toStrictEqual(widget)
  expect(widget.testId).toBe('123')
  expect(widget.getAttribute('test-id')).toBe('123')
})

test('use widget as constructor with properties', () => {
  const widget = new TestWidget({testId: '123'})

  document.body.append(widget)

  expect(document.querySelector('test-widget')).toStrictEqual(widget)
  expect(widget.testId).toBe('123')
  expect(widget.getAttribute('test-id')).toBe('123')
})

test('widget is ready', async () => {
  const widget = document.createElement('test-widget') as TestWidget
  const onReady = jest.fn()

  widget.addEventListener('ready', onReady)

  expect(widget.ready).toBe(false)

  document.body.append(widget)

  await Promise.resolve()

  expect(widget.ready).toBe(true)
  expect(onReady).toHaveBeenCalledTimes(1)
})

test('widget is changed when attribute is changed', async () => {
  const widget = document.createElement('test-widget') as TestWidget

  widget.setAttribute('test-id', '123')

  expect(widget.changed).toBe(false)
  expect(widget.testId).toBe('123')
  expect(widget.getAttribute('test-id')).toBe('123')

  document.body.append(widget)
  widget.setAttribute('test-id', '456')

  await Promise.resolve()

  expect(widget.changed).toBe(true)
  expect(widget.testId).toBe('456')
  expect(widget.getAttribute('test-id')).toBe('456')
})

test('widget is changed when property is changed', async () => {
  const widget = document.createElement('test-widget') as TestWidget

  widget.testId = '123'

  expect(widget.changed).toBe(false)
  expect(widget.testId).toBe('123')
  expect(widget.getAttribute('test-id')).toBe('123')

  document.body.append(widget)
  widget.testId = '456'

  await Promise.resolve()

  expect(widget.changed).toBe(true)
  expect(widget.testId).toBe('456')
  expect(widget.getAttribute('test-id')).toBe('456')
})

test('widget is destroyed', async () => {
  const widget = document.createElement('test-widget') as TestWidget
  const onDestroy = jest.fn()

  widget.addEventListener('destroy', onDestroy)

  document.body.append(widget)

  await Promise.resolve()

  expect(widget.destroyed).toBe(false)
  expect(onDestroy).toHaveBeenCalledTimes(0)

  widget.remove()

  await Promise.resolve()

  expect(widget.destroyed).toBe(true)
  expect(onDestroy).toHaveBeenCalledTimes(1)
})

test('show widget slot as fallback', () => {
  const widget = document.createElement('test-widget') as TestWidget

  widget.innerHTML = '<span>Loading...</span>'

  document.body.append(widget)

  expect(widget.root.innerHTML).toBe('')

  widget.showFallback()

  expect(widget.root.innerHTML).toBe('<slot></slot>')

  widget.hideFallback()

  expect(widget.root.innerHTML).toBe('')
})

test('show custom widget fallback', () => {
  const widget = document.createElement(
    'test-widget-fallback'
  ) as TestWidgetWithFallback

  document.body.append(widget)

  expect(widget.root.innerHTML).toBe('')

  widget.showFallback()

  expect(widget.root.innerHTML).toBe('<span>Loading...</span>')

  widget.hideFallback()

  expect(widget.root.innerHTML).toBe('')
})

test('emit event', () => {
  const widget = document.createElement('test-widget') as TestWidget
  const onEvent = jest.fn()

  document.body.append(widget)

  widget.addEventListener('customevent', onEvent)
  widget.emit('customevent', {detail: 'foo'})

  const [[event]] = onEvent.mock.calls

  expect(onEvent).toHaveBeenCalledTimes(1)
  expect(event.detail).toBe('foo')
})

test('emit error', () => {
  const widget = document.createElement('test-widget') as TestWidget
  const onError = jest.fn()

  document.body.append(widget)

  const error = new Error('widget error')

  widget.addEventListener('error', onError)
  widget.emitError(error)

  const [[event]] = onError.mock.calls

  expect(onError).toHaveBeenCalledTimes(1)
  expect(event.error).toBe(error)
  expect(event.message).toBe(error.message)
})
