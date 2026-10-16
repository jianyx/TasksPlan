// 引入 JWT（JSON Web Token）工具库，用于签发和验证令牌。
// 本文件使用 jwt.verify 校验令牌，而不是仅解码内容；JWT 的载荷并不等于加密数据。
import jwt from 'jsonwebtoken';

// 从服务端环境变量读取 JWT 签名密钥；变量未设置或为空字符串时，使用开发默认值。
// 使用共享密钥签名时，签发端和验证端需要使用同一个密钥，否则签名校验会失败。
// export 允许其他模块导入此常量，例如在登录成功后签发令牌时复用。
// 注意：生产环境必须配置足够强的独立密钥，不能依赖这里公开的开发默认值。
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * JWT 身份认证中间件，用于在受保护的路由处理请求之前验证调用者身份。
 * 处理流程：读取令牌 → 验证令牌 → 将用户 ID 挂到请求对象 → 放行后续处理。
 * 未提供令牌或验证失败时返回 401，表示请求缺少有效的身份凭证。
 *
 * @param req 请求对象，可读取请求头，并向其添加供后续处理使用的 userId。
 * @param res 响应对象，用于设置 HTTP 状态码并向客户端返回 JSON。
 * @param next 中间件链的继续执行函数，认证通过后调用它进入后续中间件或路由。
 *
 * 当前参数使用 any，TypeScript 不会检查其属性访问，也不会检查新增 userId 的类型。
 * 虽然声明为 async，但内部没有 await；这里的 jwt.verify 使用同步形式。
 */
export const authMiddleware = async (req: any, res: any, next: any) => {
  // 约定客户端通过请求头 Authorization: Bearer <token> 传递令牌。
  // Node.js 中请求头名称以小写形式读取，因此这里使用 authorization。
  // ?. 在请求头不存在时短路并得到 undefined，避免对 undefined 调用 split。
  // split(' ') 按空格拆分字符串，[1] 取第二段，即约定格式中的令牌部分。
  // 注意：当前只提取第二段，没有校验前缀是否为 Bearer，也没有处理多余空格。
  const token = req.headers.authorization?.split(' ')[1];

  // 没有提取到令牌或令牌为空时，返回 401 和错误信息。
  // return 同时结束当前中间件，不再执行下方验证逻辑，也不会调用 next 放行。
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    // 使用密钥校验令牌签名，并在令牌包含 exp（过期时间）、nbf（生效时间）时校验它们。
    // 签名不匹配、令牌格式错误、已过期或尚未生效等情况会抛出异常，进入 catch。
    // 校验成功时返回载荷 payload，按本项目约定，其中应包含签发时写入的 userId。
    // as { userId: string } 只是 TypeScript 类型断言，不会在运行时验证该字段。
    // 因此，验证通过不代表 userId 一定存在或一定是字符串；当前代码未单独检查它。
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    // 将载荷中的用户 ID 附加到当前请求对象，供后续路由读取当前登录用户的身份。
    // 例如可用它查询该用户的任务；具体的数据归属和操作权限仍需由业务逻辑校验。
    req.userId = payload.userId;

    // 身份认证通过，交给后续中间件或路由处理；此处不会直接向客户端返回成功响应。
    next();
  } catch {
    // 将此 try 块内捕获到的异常统一转换为 401，不向客户端暴露具体的内部错误。
    // 注意：该 catch 不能统一捕获后续异步路由中的错误。
    // return 结束当前中间件，本分支不会继续调用 next。
    return res.status(401).json({ error: 'Invalid token' });
  }
};