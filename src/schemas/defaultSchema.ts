import AsyncStorage from '@react-native-async-storage/async-storage';
import DataStore from 'react-native-local-mongodb';


interface UpdateOptions {
	multi?: boolean;
	returnUpdatedDocs?: boolean;
	upsert?: boolean;
}

export default abstract class DefaultSchema {
	private db: DataStore | undefined;
	protected abstract readonly store: string;

	init() {
		this.db = new DataStore({
			autoload: true,
			corruptAlertThreshold: 0,
			filename: this.store,
			storage: {
				async getItem(key: string, cb): Promise<string | null> {
					const item = await AsyncStorage.getItem(key);
					if (cb)
						cb(undefined, item ?? undefined);
					return null;
				},
				async removeItem(key: string, cb): Promise<void> {
					await AsyncStorage.removeItem(key);

					if (cb)
						cb(undefined);
				},
				async setItem(key: string, value: string, cb?): Promise<void> {
					await AsyncStorage.setItem(key, value);
					if (cb)
						cb(undefined);
				}
			},
			timestampData: true
		});

		return this;
	}

	public count(query: object) {
		return new Promise((resolve, reject) => {
			if (!this.db)
				reject('Database not initialized.');

			this.db!.count(query, (err, count) => {
				if (err)
					reject(err);

				resolve(count);
			});
		});
	}

	public insert<DBObject extends object>(item: DBObject) {
		return new Promise((resolve, reject) => {
			if (!this.db)
				reject('Database not initialized.');

			this.db!.insert(item, (err, doc) => {
				if (err)
					reject(err);

				resolve(doc);
			});
		});
	}

	public find<DBObject>(query: object): Promise<DBObject> {
		return new Promise((resolve, reject) => {
			if (!this.db)
				reject('Database not initialized.');

			this.db!.find(query, (err: Error, docs: DBObject) => {
				if (err)
					reject(err);

				resolve(docs);
			});
		});
	}

	public update(query: object, update: object, options: UpdateOptions) {
		return new Promise((resolve, reject) => {
			if (!this.db)
				reject('Database not initialized.');

			this.db!.update(query, update, options, (err, numAffected, affectedDocuments, upsert) => {
				if (err)
					reject(err);

				resolve({numAffected, affectedDocuments, upsert});
			});
		});
	}
}
