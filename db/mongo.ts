import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost:27017/mock_platform', {useNewUrlParser: true})
  const conn = mongoose.connection
  conn.on('connected', () => {console.log('数据库连接成功')})