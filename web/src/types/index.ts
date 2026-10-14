interface Task {
    id: number;
    text: string;
    completed: boolean;
    userId: number;
}

interface User {
    id: number;
    name: string;
    email: string;
}

export type { Task, User };
