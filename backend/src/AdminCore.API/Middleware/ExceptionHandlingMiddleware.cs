using AdminCore.Shared.Kernel.Exceptions;

namespace AdminCore.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (status, message) = ex switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, ex.Message),
                ConflictException => (StatusCodes.Status409Conflict, ex.Message),
                ForbiddenException => (StatusCodes.Status403Forbidden, ex.Message),
                UnauthorizedAccessException => (StatusCodes.Status403Forbidden, ex.Message),
                DomainException => (StatusCodes.Status400BadRequest, ex.Message),
                _ => (StatusCodes.Status500InternalServerError, "Unexpected server error.")
            };

            context.Response.StatusCode = status;
            var response = ex is ValidationException vex
                ? new { message = "Validation failed.", errors = vex.Errors }
                : (object)new { message };
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
