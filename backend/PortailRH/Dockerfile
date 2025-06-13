# Étape 1 : Build avec Maven
FROM maven:3.8.7-eclipse-temurin-17 AS build
WORKDIR /app

# Copier le pom.xml et télécharger les dépendances
COPY pom.xml .
RUN mvn dependency:go-offline

# Copier le reste des fichiers du projet
COPY . .
RUN mvn clean package -DskipTests

# Étape 2 : Image de run
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copier le JAR compilé
COPY --from=build /app/target/PortailRH-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080

# Démarrer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
