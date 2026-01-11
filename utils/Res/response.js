
export const successResponse = (res, { code = 200, message, data = null }) => {
  return res.status(code).json({
    success: true,
    error: false,
    message,
    data
  });
};

export const errorResponse = (res, { code = 500, message, errors = [] }) => {
  const response = {
    success: false,
    error: true,
    message
  };

  if (errors.length > 0) {
    response.error = errors;
  }

  return res.status(validateError(code)).json(response);
};

export const paginatedResponse = (res, { 
  code = 200, 
  message, 
  data = [], 
  totalCount, 
  currentPage, 
  pageSize 
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(code).json({
    success: true,
    error: false,
    message,
    data,
    totalCount,
    currentPage,
    pageSize,
    totalPages
  });
};

export const success = (res, obj) => {
  console.log("res obj : ", obj.message);

  const { code, message, data, pagination } = obj;

  return res.status(code).json({ status: true, message, data, pagination });
};

export const error = (res, e) => {
  const { code, message } = e;

  return res.status(validateError(code)).json({ status: false, message, data: null, pagination: null });
};

export const validateError = (code) => {
  const errorCode = [100, 101, 200, 201, 202,
    203, 204, 205, 206, 300,
    301, 302, 303, 304, 305,
    306, 307, 400, 401, 402,
    403, 404, 405, 406, 407,
    408, 409, 410, 411, 412,
    413, 414, 415, 416, 417,
    500, 501, 502, 503, 504, 505];

  return errorCode.includes(code) ? code : 503;
};