import { Redirect } from "expo-router";

/**
 * The centre tab is intercepted by a custom tabBarButton that opens the
 * add-transaction modal, so this screen is never normally rendered. It exists
 * because expo-router requires a file for the route, and it redirects rather
 * than showing a blank tab if it is ever reached directly.
 */
export default function AddTabScreen() {
  return <Redirect href="/transaction/new" />;
}
