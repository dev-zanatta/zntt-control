export const AppInfo = {
  create: (data = {}) => ({
    version:  data.version  || '',
    dataPath: data.dataPath || '',
  }),
}
