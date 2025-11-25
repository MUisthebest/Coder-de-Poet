// File: auth_service.Domain/Common/OperationResult.cs

namespace auth_service.Domain.Common
{
    // Dùng cho mọi response có data
    public class OperationResult<T>
    {
        public bool IsSuccess => Errors == null || Errors.Count == 0;
        public bool IsFailed => !IsSuccess;

        public T? Data { get; protected set; }
        public IReadOnlyList<ErrorDetail> Errors { get; protected set; } = new List<ErrorDetail>();

        // Thành công
        public static OperationResult<T> Success(T data)
        {
            return new OperationResult<T>
            {
                Data = data
            };
        }

        // Thất bại - nhiều lỗi
        public static OperationResult<T> Failure(IEnumerable<ErrorDetail> errors)
        {
            return new OperationResult<T>
            {
                Errors = errors.ToList()
            };
        }

        // Thất bại - 1 lỗi
        public static OperationResult<T> Failure(ErrorDetail error)
            => Failure(new[] { error });

        public static OperationResult<T> Failure(string code, string message)
            => Failure(new ErrorDetail(code, message));

        // Helper để dùng trong UseCase (nếu bạn thích cách viết cũ)
        public void Succeed(T data)
        {
            Data = data;
            Errors = new List<ErrorDetail>();
        }

        public void AddError(string code, string message)
        {
            var list = Errors.ToList();
            list.Add(new ErrorDetail(code, message));
            Errors = list;
        }
    }

    // Dùng khi không trả về data (ví dụ: Delete, Logout...)
    public class OperationResult : OperationResult<object>
    {
        public static OperationResult Success() => new() { Data = new { } };
        public static new OperationResult Failure(string code, string message)
            => new OperationResult { Errors = new List<ErrorDetail> { new(code, message) } };
    }

    // Thông tin lỗi chi tiết
    public record ErrorDetail(string Code, string Message);
}