FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ide_service.csproj ./
RUN dotnet restore ./ide_service.csproj

COPY . ./
RUN dotnet publish ./ide_service.csproj -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker

COPY --from=build /out ./
EXPOSE 8089
ENTRYPOINT ["dotnet","ide_service.dll"]
