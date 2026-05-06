FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY AdminCore.slnx .
COPY src/ src/

RUN dotnet restore src/AdminCore.API/AdminCore.API.csproj
RUN dotnet publish src/AdminCore.API/AdminCore.API.csproj -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN useradd -m -u 1001 appuser && chown -R appuser /app
USER appuser

COPY --from=build /publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "AdminCore.API.dll"]
