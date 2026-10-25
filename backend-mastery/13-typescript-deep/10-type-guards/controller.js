export default {
  getType: (req, res) => res.json({ value: req.body.value }),
  checkGuard: (req, res) => res.json({ guarded: true })
};
