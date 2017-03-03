const path = require('path')
const express = require('express')
const Sequelize = require('sequelize')
var app = express()
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const connection = new Sequelize({ dialect: 'sqlite', storage: '.DB' })

const Room = connection.define('room', {
  roomcode: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['roomcode']
    }
  ],
  timestamps: false
})

const Line = connection.define('line', {
  color: Sequelize.STRING,
  size: Sequelize.INTEGER,
  lx: Sequelize.INTEGER,
  ly: Sequelize.INTEGER,
  x: Sequelize.INTEGER,
  y: Sequelize.INTEGER
}, {
  timestamps: false
})

connection.sync()

Room.hasMany(Line)
Line.belongsTo(Room)

app.use('/', express.static('public'))
app.use('/', express.static('node_modules/socket.io-client/dist'))
io.on('connection', sock => {
  sock.on('join', roomcode => {
    Room.findCreateFind({
      where: { roomcode }
    })
    .then(room => {
      Line.findAll({
        where: { roomRoomcode: roomcode },
        order: [
          ['id', 'ASC']
        ]
      })
      .then(lines => lines.map(line => line.dataValues))
      .then(lines => {
        sock.emit('lines', JSON.stringify(lines))
      })
    })
  })

  sock.on('line', res => {
    const line = JSON.parse(res)
    Line.create(line)
    io.emit('line' + line.roomRoomcode, res)
  })

  sock.on('clear', dt => {
    dt = JSON.parse(dt)
    if (dt.password !== 'weeew') return
    Line.destroy({
      where: { roomRoomcode: dt.room }
    })
  })
});

server.listen(3000, '0.0.0.0');
