# 1. Build Aşaması
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Tüm kaynak kodları çalışma dizinine kopyalıyoruz
COPY . .

# Eğer build root'tan atılırsa backend klasörüne geç, yoksa mevcut dizinde kal
RUN if [ -d "backend" ]; then cd backend; fi && dotnet restore && dotnet publish -c Release -o /app/out

# 2. Runtime Aşaması
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "backend.dll"]