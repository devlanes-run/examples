pluginManagement {
    val quarkusVersion = providers.gradleProperty("quarkusVersion").get()
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        id("io.quarkus") version quarkusVersion
    }
}

rootProject.name = "quarkus-gradle"
