FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ide_service/ide_service.csproj ide_service/

RUN dotnet restore ide_service/ide_service.csproj

COPY ..

RUN dotnet publish ide_service/ide_service.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0-jammy-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  libgdiplus \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /out .
EXPOSE 8089

ENTRYPOINT ["dotnet", "ide_service.dll"]

