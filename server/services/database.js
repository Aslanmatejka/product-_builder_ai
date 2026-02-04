const supabase = require('./supabase');

async function createProject(name = 'Untitled Project') {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, status: 'draft' })
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data;
}

async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get project: ${error.message}`);
  return data;
}

async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to get projects: ${error.message}`);
  return data || [];
}

async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to update project: ${error.message}`);
  return data;
}

async function deleteProject(projectId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

async function createBuild(buildData) {
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', buildData.project_id)
    .maybeSingle();

  const { data: lastBuild } = await supabase
    .from('builds')
    .select('build_number')
    .eq('project_id', buildData.project_id)
    .order('build_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const buildNumber = (lastBuild?.build_number || 0) + 1;

  const { data, error } = await supabase
    .from('builds')
    .insert({ ...buildData, build_number: buildNumber })
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to create build: ${error.message}`);
  return data;
}

async function updateBuild(buildId, updates) {
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', buildId)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to update build: ${error.message}`);
  return data;
}

async function getBuild(buildId) {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('id', buildId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get build: ${error.message}`);
  return data;
}

async function getProjectBuilds(projectId) {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get builds: ${error.message}`);
  return data || [];
}

async function createMessage(messageData) {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select()
    .maybeSingle();

  if (error) throw new Error(`Failed to create message: ${error.message}`);
  return data;
}

async function getProjectMessages(projectId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get messages: ${error.message}`);
  return data || [];
}

async function deleteProjectMessages(projectId) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('project_id', projectId);

  if (error) throw new Error(`Failed to delete messages: ${error.message}`);
}

module.exports = {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  createBuild,
  updateBuild,
  getBuild,
  getProjectBuilds,
  createMessage,
  getProjectMessages,
  deleteProjectMessages
};
