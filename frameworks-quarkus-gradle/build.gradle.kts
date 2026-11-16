plugins {
    java
    id("io.quarkus")
}

repositories {
    mavenCentral()
}

val quarkusVersion = providers.gradleProperty("quarkusVersion").get()

dependencies {
    implementation(enforcedPlatform("io.quarkus.platform:quarkus-bom:$quarkusVersion"))
    implementation("io.quarkus:quarkus-arc")
    implementation("io.quarkus:quarkus-rest")
    implementation("io.quarkus:quarkus-rest-jackson")
    implementation("io.quarkus:quarkus-rest-qute")
    implementation("io.quarkus:quarkus-agroal")
    implementation("io.quarkus:quarkus-jdbc-postgresql")
}

group = "com.acme"
version = "0.1.0"

tasks.withType<JavaCompile> {
    options.release = 21
    options.encoding = "UTF-8"
    // Quarkus REST reads parameter names from the bytecode.
    options.compilerArgs.add("-parameters")
}
