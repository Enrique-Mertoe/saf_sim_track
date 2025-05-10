class DialogNode<T> {
    id: string;
    content: T;
    next: DialogNode<T> | null = null;
    prev: DialogNode<T> | null = null;

    constructor(id: string, content: T) {
        this.id = id;
        this.content = content;
    }
}

class DialogStack<T> {
    head: DialogNode<T> | null = null;
    tail: DialogNode<T> | null = null;
    length: number = 0;

    push(id: string, dialog: T): void {
        const newNode = new DialogNode(id, dialog);
        if (!this.tail) {
            this.head = this.tail = newNode;
        } else {
            this.tail.next = newNode;
            newNode.prev = this.tail;
            this.tail = newNode;
        }
        this.length++;
    }

    pop(): DialogNode<T> | null {
        if (!this.tail) return null;

        const removedNode = this.tail;
        this.tail = this.tail.prev;

        if (this.tail) {
            this.tail.next = null;
        } else {
            this.head = null; // Empty stack
        }
        this.length--;
        return removedNode;
    }

    getCurrentDialog(): DialogNode<T> | null {
        return this.tail;
    }

    clear(): void {
        this.head = this.tail = null;
    }
}

export default DialogStack
