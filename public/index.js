function main(global) {
  const socket = io()

  if (!global.location.href.includes('#')) global.location.href += '#'

  const room = global.location.href.split('#')[1].split('?')[0] || 'main'
  const password = global.location.href.split('?')[1]
  const colorPicker = document.getElementById('colorpicker')
  const size = document.getElementById('size')
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')

  let drawing = false
  let drawTimeout = false
  let redraw = false
  let lastX = 0
  let lastY = 0
  let lines = []

  socket.emit('join', room)

  socket.on('lines', res => {
    lines = JSON.parse(res)
    redraw = true
  })

  socket.on('line' + room, line => {
    draw(JSON.parse(line))
  })

  function getColor() {
    return colorPicker.options[colorPicker.selectedIndex].value
  }

  function getSize() {
    return size.value
  }

  function setDimentions() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight - 30
    redraw = true
  }

  function updatePosition(x, y) {
    ;[lastX, lastY] = [x, y]    
  }

  function drawClient(e) {
    if (!drawing || drawTimeout) return
    drawTimeout = true
    const line = {
      color: getColor(),
      size: getSize(),
      lx: lastX,
      ly: lastY,
      x: e.offsetX,
      y: e.offsetY,
      roomRoomcode: room
    }
    lines.push(line)
    draw(line)
    updatePosition(line.x, line.y)
    socket.emit('line', JSON.stringify(line))
    setTimeout(function() {
      drawTimeout = false
    }, 40);
  }

  function draw(line) {
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = line.color
    ctx.lineWidth = line.size
    ctx.beginPath()
    ctx.moveTo(line.lx, line.ly)
    ctx.lineTo(line.x, line.y)
    ctx.stroke()
  }

  function startdrawing() {
    drawing = true
  }

  function stopdrawing() {
    drawing = false
  }

  canvas.addEventListener('mousemove', drawClient)
  canvas.addEventListener('touchmove', drawClient)
  canvas.addEventListener('mousedown', function(e) {
    startdrawing()
    updatePosition(e.offsetX, e.offsetY)
  })
  canvas.addEventListener('touchstart', function(e) {
    startdrawing()
    updatePosition(e.offsetX, e.offsetY)
  })
  canvas.addEventListener('mouseup', stopdrawing)
  canvas.addEventListener('touchend', stopdrawing)
  canvas.addEventListener('touchcancel', stopdrawing)
  canvas.addEventListener('mouseout', stopdrawing)
  global.onresize = setDimentions

  setDimentions()

  setInterval(() => {
    if (redraw) {
      redraw = false
      for (let line of lines) {
        draw(line)
      }
    }
  }, 1000)

  if (password) {
    const nav = document.querySelector('nav')
    const clear = document.createElement('div')
    clear.innerHTML = '<button type="button" id="clear" style="float: left">clear</button>'
    nav.prepend(clear.firstChild)

    document.querySelector('#clear').addEventListener('click', function(e) {
      e.preventDefault()
      socket.emit('clear', JSON.stringify({room, password}))
    })
  }
}

main(window)
