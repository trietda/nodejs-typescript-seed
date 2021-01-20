/**
 * Ref: https://trevoratlas.com/posts/how-to-create-a-typescript-singleton-decorator
 */

export const SINGLETON_KEY = Symbol('singleton');

export type SingletonClass<T> = T & {
  [SINGLETON_KEY]?: T
};

export default function createSingleton<T extends new (...args: any[]) => any>(type: T) {
  return new Proxy(
    type,
    {
      construct(target: SingletonClass<T>, argsList, newTarget) {
        if (target.prototype !== newTarget.prototype) {
          return Reflect.construct(target, argsList, newTarget);
        }

        if (!target[SINGLETON_KEY]) {
          // eslint-disable-next-line no-param-reassign
          target[SINGLETON_KEY] = Reflect.construct(target, argsList, newTarget);
        }

        return target[SINGLETON_KEY];
      },
    },
  );
}
