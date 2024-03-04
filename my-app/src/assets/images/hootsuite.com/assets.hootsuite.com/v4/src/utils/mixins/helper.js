import _ from 'underscore';
import util from 'utils/util';
import Cocktail from 'backbone.cocktail';


var mixinHelper = function (constructor) {
    constructor.extend = mixinHelper.extend;
    constructor.mixin = mixinHelper.mixin;

    return constructor;
};
mixinHelper.extend = function extend(protoProps, classProps) {
    classProps = _.extend(classProps || {}, {mixin: mixinHelper.mixin});
    var Klass = util.extend.call(this, protoProps, classProps);

    var mixins = Klass.prototype.mixins;
    if (mixins && Object.prototype.hasOwnProperty.call(Klass.prototype, 'mixins')) {
        Klass.mixin(mixins);
    }

    return Klass;
};
mixinHelper.mixin = function mixin() {
    Cocktail.mixin(this, _.toArray(arguments));
};

export default mixinHelper;
