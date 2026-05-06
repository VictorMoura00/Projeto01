using AdminCore.API.Middleware;

namespace AdminCore.API.Extensions;

public static class ExceptionHandlingExtensions
{
    public static IApplicationBuilder UseApiExceptionHandling(this IApplicationBuilder app) =>
        app.UseMiddleware<ExceptionHandlingMiddleware>();
}
