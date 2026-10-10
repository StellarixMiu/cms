/** biome-ignore-all lint/complexity/noStaticOnlyClass: <singleton pattern> */
/** biome-ignore-all lint/complexity/noThisInStatic: <singleton pattern> */
export abstract class Singleton {
	private static instances = new Map<string, unknown>();

	static getInstance<T extends Singleton>(this: new () => T): T {
		let instance = Singleton.instances.get(this.name) as T | undefined;
		if (!instance) {
			instance = new this();
			Singleton.instances.set(this.name, instance);
		}
		return instance;
	}
}
