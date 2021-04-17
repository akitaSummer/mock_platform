export const queryIndex = `import axios from 'axios'
import * as query from './query'
import { APIs } from '../types'

interface Query {
  [propsName: string]: () => string
}

const instance = axios.create({
  baseURL: '',

  headers: {
    'content-type': 'application/json; charset=utf-8'
  },
  timeout: 10 * 1000,
  withCredentials: true
  // withCredentials: false
})

/**
 * 调用 GraphQL 接口
 *
 * @param method      thrift 接口名
 * @param [params]    variables 参数，对应 thrift 接口的 request 参数
 * @param [multiple]  标记是否同时调多个 thrift 接口
 */
export async function gql<T extends keyof APIs>(method: T, params: APIs[T]['req'] = null, multiple = false): Promise<APIs[T]['resp']> {
  const gqlQuery = (query as Query)[method]
  if (typeof gqlQuery !== 'function') {
    throw new TypeError(\`Invalid method "\${method}"\`)
  }

  const {
    data: { data, errors }
  } = await instance.post('/', {
    query: gqlQuery(),
    variables: { data: params }
  })

  return multiple ? data : data[method]
}
`;
