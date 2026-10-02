class ApiResponse {
    constructor(statusCode, status, message = 'success', data) {
        this.status = status,
            this.statusCode = statusCode,
            this.message = message,
            this.data = data,
            this.success = statusCode < 400;
    }
}

export default ApiResponse;