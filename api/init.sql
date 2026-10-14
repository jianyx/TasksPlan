CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  dingtalk_webhook text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  template_id integer,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE subtasks (
  id serial PRIMARY KEY,
  task_id integer NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  scheduled_date date NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE task_templates (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  default_duration integer NOT NULL DEFAULT 30,
  subtask_pattern jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);