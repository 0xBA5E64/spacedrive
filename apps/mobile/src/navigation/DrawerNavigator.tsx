import DrawerContent from '@app/components/drawer/DrawerContent';
import { DrawerScreenProps, createDrawerNavigator } from '@react-navigation/drawer';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

import type { RootStackParamList } from '.';
import type { TabParamList } from './TabNavigator';
import TabNavigator from './TabNavigator';

const Drawer = createDrawerNavigator<DrawerNavParamList>();

export default function DrawerNavigator() {
	return (
		<Drawer.Navigator
			initialRouteName="Home"
			screenOptions={{
				headerShown: false,
				drawerStyle: {
					backgroundColor: '#08090D',
					width: '75%'
				},
				overlayColor: 'transparent',
				drawerType: 'slide',
				swipeEdgeWidth: 50
			}}
			drawerContent={(props) => <DrawerContent {...(props as any)} />}
		>
			<Drawer.Screen name="Home" component={TabNavigator} />
		</Drawer.Navigator>
	);
}

export type DrawerNavParamList = {
	Home: NavigatorScreenParams<TabParamList>;
};

export type HomeDrawerScreenProps<Screen extends keyof DrawerNavParamList> = CompositeScreenProps<
	DrawerScreenProps<DrawerNavParamList, Screen>,
	StackScreenProps<RootStackParamList, 'Root'>
>;
