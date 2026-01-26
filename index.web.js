import { AppRegistry, View, Text } from 'react-native';
import { name as appName } from './app.json';

const App = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'cyan' }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Bypassed Router: It Works!</Text>
    </View>
);

AppRegistry.registerComponent('app', () => App);
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent('Yap2Learn', () => App);

if (typeof window !== 'undefined') {
    const rootTag = document.getElementById('root') || document.getElementById('main');
    if (rootTag) {
        AppRegistry.runApplication('Yap2Learn', { rootTag });
    }
}
