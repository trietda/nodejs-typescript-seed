import Singleton from '../Singleton';

describe('Singleton()', () => {
  it('should create 1 instance of the class', () => {
    @Singleton
    class TestClass {
    }

    const instance1 = new TestClass();
    const instance2 = new TestClass();

    expect(instance1).toBe(instance2);
  });

  it('should not create singleton for children classes', () => {
    @Singleton
    class TestClass {
    }
    class TestChildClass extends TestClass {
    }

    const childClassInstance1 = new TestChildClass();
    const childClassInstance2 = new TestChildClass();

    expect(childClassInstance1).not.toBe(childClassInstance2);
  });
});
