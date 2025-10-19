import task, { Task } from "tasuku"
import { AsyncLocalStorage } from "node:async_hooks"

import { TaskCallback } from "@/Protocols/NotificationProtocol"

import ErrorHandlerUtil from "@/Utils/ErrorHandlerUtil"

class NotificationUtil {
	private readonly taskContextStorage = new AsyncLocalStorage<{ currentTask?: Task }>()

	async task<Result>(title: string, callbackFn: TaskCallback<Result>): Promise<Result> {
		try {
			const taskContextStorage = this.taskContextStorage.getStore()
			const taskFn = taskContextStorage?.currentTask || task

			const runner = await taskFn(title, async (taskConfig) => (
				this.taskContextStorage.run({ currentTask: taskConfig.task }, async () => {
					try {
						return await callbackFn(taskConfig)
					} catch (error) {
						const typedError = error as Error

						ErrorHandlerUtil.handle(typedError)
						taskConfig.setError(typedError)
					}
				})
			))

			return runner.result as Result
		} catch (error) {
			const typedError = error as Error

			throw typedError
			ErrorHandlerUtil.handle(typedError)
		}
	}
}

export default new NotificationUtil()