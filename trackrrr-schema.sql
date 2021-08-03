CREATE TABLE summoners (
    name VARCHAR(16),
    region VARCHAR(16),
    profile JSONB NOT NULL,
    rank JSONB,
    matches JSONB,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (name, region)
);