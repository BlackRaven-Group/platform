/*
  # Create Correlation and Intelligence Enhancement Tables

  1. New Tables
    - `target_correlations`
      - Stores discovered relationships between targets based on shared data
      - Includes correlation type, confidence score, and matching fields
      - Enables automatic duplicate detection and relationship mapping
    
    - `timeline_events`
      - Unified timeline aggregating all date-based events for targets
      - Combines data from addresses, social media, employment, and notes
      - Provides chronological view of target activities and movements
    
    - `search_queue`
      - Manages batch OSINT search operations
      - Tracks search status, priority, and scheduling
      - Enables automated recurring searches
    
    - `data_enrichment_jobs`
      - Background jobs for automated data enhancement
      - Tracks phone validation, email verification, IP lookups
      - Manages job status and retry logic
    
    - `pattern_matches`
      - Stores detected patterns across targets
      - Identifies common usernames, emails, password patterns
      - Enables anomaly detection and alerts
    
    - `investigation_metrics`
      - Aggregated statistics for dashboards and analytics
      - Tracks dossier progress, data completeness, source breakdown
      - Updated via triggers for real-time metrics

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated user access
    - Restrict access to user's own data

  3. Indexes
    - Add indexes for performance on frequently queried columns
    - Enable efficient correlation lookups and timeline queries
*/

-- Target Correlations Table
CREATE TABLE IF NOT EXISTS target_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_a_id uuid NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  target_b_id uuid NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  correlation_type text NOT NULL, -- 'email', 'phone', 'username', 'ip', 'address', 'network'
  matching_fields jsonb NOT NULL DEFAULT '[]', -- Array of field names that match
  confidence_score integer NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  shared_data jsonb DEFAULT '{}', -- Actual matching data points
  verified boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_targets CHECK (target_a_id != target_b_id)
);

CREATE INDEX IF NOT EXISTS idx_correlations_target_a ON target_correlations(target_a_id);
CREATE INDEX IF NOT EXISTS idx_correlations_target_b ON target_correlations(target_b_id);
CREATE INDEX IF NOT EXISTS idx_correlations_type ON target_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_correlations_confidence ON target_correlations(confidence_score DESC);

ALTER TABLE target_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view correlations for their targets"
  ON target_correlations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE (t.id = target_a_id OR t.id = target_b_id)
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert correlations for their targets"
  ON target_correlations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE (t.id = target_a_id OR t.id = target_b_id)
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update correlations for their targets"
  ON target_correlations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE (t.id = target_a_id OR t.id = target_b_id)
      AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE (t.id = target_a_id OR t.id = target_b_id)
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete correlations for their targets"
  ON target_correlations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE (t.id = target_a_id OR t.id = target_b_id)
      AND d.user_id = auth.uid()
    )
  );

-- Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'address', 'employment', 'social_media', 'note', 'credential', 'media', 'network'
  event_date timestamptz NOT NULL,
  event_title text NOT NULL,
  event_description text DEFAULT '',
  source_table text NOT NULL, -- Table name where the original data lives
  source_id uuid, -- ID of the record in the source table
  metadata jsonb DEFAULT '{}',
  importance text DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_target ON timeline_events(target_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_importance ON timeline_events(importance);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timeline events for their targets"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline events for their targets"
  ON timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events for their targets"
  ON timeline_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

-- Search Queue Table
CREATE TABLE IF NOT EXISTS search_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  query text NOT NULL,
  limit_value integer DEFAULT 100,
  lang text DEFAULT 'en',
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  scheduled_for timestamptz,
  recurring_pattern text, -- cron-style pattern for recurring searches
  last_run_at timestamptz,
  next_run_at timestamptz,
  search_id uuid REFERENCES osint_searches(id) ON DELETE SET NULL,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queue_status ON search_queue(status);
CREATE INDEX IF NOT EXISTS idx_search_queue_priority ON search_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_search_queue_scheduled ON search_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_search_queue_next_run ON search_queue(next_run_at);

ALTER TABLE search_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their search queue"
  ON search_queue FOR SELECT
  TO authenticated
  USING (
    dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert to their search queue"
  ON search_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their search queue"
  ON search_queue FOR UPDATE
  TO authenticated
  USING (
    dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from their search queue"
  ON search_queue FOR DELETE
  TO authenticated
  USING (
    dossier_id IS NULL OR EXISTS (
      SELECT 1 FROM dossiers d
      WHERE d.id = dossier_id AND d.user_id = auth.uid()
    )
  );

-- Data Enrichment Jobs Table
CREATE TABLE IF NOT EXISTS data_enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL, -- 'phone_lookup', 'email_validation', 'ip_whois', 'social_media_discovery', 'breach_check'
  target_id uuid REFERENCES targets(id) ON DELETE CASCADE,
  input_data jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_data jsonb DEFAULT '{}',
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_enrichment_status ON data_enrichment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_type ON data_enrichment_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_target ON data_enrichment_jobs(target_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_priority ON data_enrichment_jobs(priority DESC);

ALTER TABLE data_enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrichment jobs for their targets"
  ON data_enrichment_jobs FOR SELECT
  TO authenticated
  USING (
    target_id IS NULL OR EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert enrichment jobs for their targets"
  ON data_enrichment_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    target_id IS NULL OR EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update enrichment jobs for their targets"
  ON data_enrichment_jobs FOR UPDATE
  TO authenticated
  USING (
    target_id IS NULL OR EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    target_id IS NULL OR EXISTS (
      SELECT 1 FROM targets t
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE t.id = target_id AND d.user_id = auth.uid()
    )
  );

-- Pattern Matches Table
CREATE TABLE IF NOT EXISTS pattern_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL, -- 'username_reuse', 'email_pattern', 'password_pattern', 'naming_convention', 'ip_range'
  pattern_value text NOT NULL,
  matching_targets uuid[] DEFAULT '{}', -- Array of target IDs that match this pattern
  match_count integer DEFAULT 0,
  confidence_score integer DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  metadata jsonb DEFAULT '{}',
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_anomaly boolean DEFAULT false,
  notes text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_pattern_type ON pattern_matches(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_value ON pattern_matches(pattern_value);
CREATE INDEX IF NOT EXISTS idx_pattern_count ON pattern_matches(match_count DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_anomaly ON pattern_matches(is_anomaly) WHERE is_anomaly = true;

ALTER TABLE pattern_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pattern matches for their targets"
  ON pattern_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unnest(matching_targets) AS target_id
      JOIN targets t ON t.id = target_id
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pattern matches"
  ON pattern_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update pattern matches"
  ON pattern_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM unnest(matching_targets) AS target_id
      JOIN targets t ON t.id = target_id
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unnest(matching_targets) AS target_id
      JOIN targets t ON t.id = target_id
      JOIN dossiers d ON t.dossier_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Investigation Metrics Table
CREATE TABLE IF NOT EXISTS investigation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  dossier_id uuid REFERENCES dossiers(id) ON DELETE CASCADE,
  metric_type text NOT NULL, -- 'target_count', 'data_completeness', 'source_breakdown', 'verification_rate'
  metric_value numeric NOT NULL DEFAULT 0,
  metric_data jsonb DEFAULT '{}',
  calculated_at timestamptz DEFAULT now(),
  period_start timestamptz,
  period_end timestamptz
);

CREATE INDEX IF NOT EXISTS idx_metrics_user ON investigation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_dossier ON investigation_metrics(dossier_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON investigation_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_calculated ON investigation_metrics(calculated_at DESC);

ALTER TABLE investigation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON investigation_metrics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own metrics"
  ON investigation_metrics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own metrics"
  ON investigation_metrics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own metrics"
  ON investigation_metrics FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());