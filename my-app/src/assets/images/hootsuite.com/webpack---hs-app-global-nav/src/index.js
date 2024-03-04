import * as React from "react";
import * as ReactDOM from "react-dom";
import { register } from "fe-lib-async-app";
import { GlobalNavigation } from "fe-nav-comp-global-navigation";
import setAdAccountCountToLocalStorage from "./setAdAccountCountToLocalStorage";

setAdAccountCountToLocalStorage();

register("hs-app-global-nav", {
  mount(node, props) {
    ReactDOM.render(<GlobalNavigation {...props} />, node);
  },

  unmount(node) {
    ReactDOM.unmountComponentAtNode(node);
  },
});
