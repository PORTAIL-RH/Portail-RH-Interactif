# Use Maven image to build the project
FROM maven:3.8.7-eclipse-temurin-17 AS build
WORKDIR /app

# Copy only the POM file first for better caching
COPY ./pom.xml .
RUN mvn dependency:go-offline

# Now copy the rest of the project files
COPY . .

# Run Maven build
RUN mvn clean package -DskipTestss

# Use a lightweight OpenJDK image for the final container
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
