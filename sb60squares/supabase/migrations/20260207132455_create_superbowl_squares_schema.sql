/*
  # Super Bowl Squares Schema

  1. New Tables
    - `squares_pages`
      - `id` (uuid, primary key)
      - `name` (text) - name of the squares page/pool
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `square_cells`
      - `id` (uuid, primary key)
      - `page_id` (uuid, foreign key to squares_pages)
      - `row` (integer, 0-9) - row position in 10x10 grid
      - `col` (integer, 0-9) - column position in 10x10 grid
      - `owner` (text, optional) - name of person owning the square
      - `image_url` (text, optional) - URL to image of the square
      - `created_at` (timestamp)
    
    - `scores`
      - `id` (uuid, primary key)
      - `page_id` (uuid, foreign key to squares_pages)
      - `quarter` (integer) - quarter number (1-4 or OT)
      - `team_a_score` (integer)
      - `team_b_score` (integer)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Public read access for all squares pages and data
*/

CREATE TABLE IF NOT EXISTS squares_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS square_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES squares_pages(id) ON DELETE CASCADE,
  row integer NOT NULL CHECK (row >= 0 AND row <= 9),
  col integer NOT NULL CHECK (col >= 0 AND col <= 9),
  owner text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, row, col)
);

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES squares_pages(id) ON DELETE CASCADE,
  quarter integer NOT NULL,
  team_a_score integer NOT NULL DEFAULT 0,
  team_b_score integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(page_id, quarter)
);

ALTER TABLE squares_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE square_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squares pages are publicly readable"
  ON squares_pages FOR SELECT
  USING (true);

CREATE POLICY "Square cells are publicly readable"
  ON square_cells FOR SELECT
  USING (true);

CREATE POLICY "Scores are publicly readable"
  ON scores FOR SELECT
  USING (true);

CREATE INDEX idx_square_cells_page_id ON square_cells(page_id);
CREATE INDEX idx_scores_page_id ON scores(page_id);
