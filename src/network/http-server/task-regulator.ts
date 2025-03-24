import { EventEmitter } from 'events';

type AsyncCallback<T = void> = () => Promise<T>;

/**
 * Runs tasks according to the concurrency config.
 */
export class TaskRegulator extends EventEmitter<'error' | 'processed'> {

    private queue: AsyncCallback[] = [];
    private active = 0;

    /** Amount of tasks that have not yet started */
    get pending(): number {
        return this.queue.length;
    }

    constructor(private concurrency: number = 1) {
        super();
    }

    /** Add a task to run when capacity becomes available */
    add(task: AsyncCallback) {
        this.queue.push(task);
        this.process();
    }

    /** Runs the next task in the queue */
    private process() {
        while (this.active < this.concurrency && this.queue.length) {
            const task = this.queue.shift();
            if (!task) {
                continue;
            }

            this.active++;
            task()
                .then(() => this.emit('processed'))
                .catch(e => this.emit('error', e))
                .finally(() => {
                    this.active--;
                    this.process();
                });
        }
    }

}