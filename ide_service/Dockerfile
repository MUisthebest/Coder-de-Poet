FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ide_service.csproj ./
RUN dotnet restore ./ide_service.csproj
COPY . ./
RUN dotnet publish ./ide_service.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends docker.io ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /out ./
EXPOSE 8089
ENTRYPOINT ["dotnet", "ide_service.dll"]
