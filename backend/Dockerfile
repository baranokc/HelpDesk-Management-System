# Multi-stage build for .NET 10 backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["backend.csproj", "backend/"]
WORKDIR /src/backend
RUN dotnet restore "backend.csproj"

# Copy source code and build
COPY . .
RUN dotnet build "backend.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "backend.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 8080
EXPOSE 8443

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD dotnet --version || exit 1

ENTRYPOINT ["dotnet", "backend.dll"]
