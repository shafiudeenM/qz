import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#ffffff",
                    },
                    headerTintColor: "#ea580c",
                    headerTitleStyle: {
                        fontWeight: "bold",
                    },
                    headerShadowVisible: false,
                }}
            />
        </>
    );
}
