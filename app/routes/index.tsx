import { createRoute } from "honox/factory";
import LogoAnimation from "../islands/logo-animation";

export default createRoute((c) => {
  return c.render(
    <div>
      <div class="w-full h-screen overflow-hidden bg-black">
        <title>UI Lab</title>
        <LogoAnimation />
      </div>
    </div>,
  );
});
