#!/bin/bash
#SBATCH --job-name=microfake
#SBATCH --account=ds6042
#SBATCH --partition=gpu
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=00:20:00
#SBATCH --output=%x-%j.out
#
# Generic GPU runner for any microfake companion script.
#   sbatch run_hpc.slurm faceswap.py --a 7 --b 21
#   sbatch run_hpc.slurm gan_faces.py --steps 4000
#   sbatch run_hpc.slurm diffusion_faces.py --steps 4000
#   sbatch run_hpc.slurm video_faces.py --a 7 --b 21
#   sbatch run_hpc.slurm detect_faces.py
#
# Watch:  squeue --me         Result: the PNG(s) that script writes, in this dir.
# PyTorch comes from the prebuilt NGC container -- nothing to install.

module load apptainer/1.4.5 pytorch/2.11.0

apptainer exec --nv "$CONTAINERDIR/pytorch-2.11.0.sif" python "$@"

echo "done. copy any PNGs down with:  scp $USER@login.hpc.virginia.edu:$(pwd)/'*.png' ."
